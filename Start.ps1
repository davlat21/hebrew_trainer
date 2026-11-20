param([switch]$NoBrowser, [ValidateRange(1024, 65535)][int]$Port = 8765)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$types = @{
    '.html' = 'text/html; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.map' = 'application/json; charset=utf-8'
    '.mp3' = 'audio/mpeg'
}

function Send-Headers($stream, $status, $length, $extra = '') {
    $header = "HTTP/1.1 $status`r`nConnection: close`r`nContent-Length: $length`r`n${extra}`r`n"
    $bytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($bytes, 0, $bytes.Length)
}

function Send-File($client) {
    $client.ReceiveTimeout = 1500
    $client.SendTimeout = 3000
    $stream = $client.GetStream()
    $reader = [IO.StreamReader]::new($stream)
    $request = $reader.ReadLine()
    if ($request -notmatch '^(GET|HEAD) (/[^ ]*) HTTP/1\.[01]$') {
        Send-Headers $stream '400 Bad Request' 0
        return
    }
    $method = $Matches[1]
    $target = $Matches[2]
    $range = ''
    for ($i = 0; $i -lt 100; $i++) {
        $header = $reader.ReadLine()
        if (!$header) { break }
        if ($header -match '^Range:\s*(.+)$') { $range = $Matches[1] }
    }
    $relative = [Uri]::UnescapeDataString(($target -split '\?', 2)[0]).TrimStart('/')
    if (!$relative) { $relative = 'index.html' }
    $path = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relative))
    $ext = [IO.Path]::GetExtension($path)
    if (!$path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or
        !$types.ContainsKey($ext) -or ![IO.File]::Exists($path)) {
        Send-Headers $stream '404 Not Found' 0
        return
    }
    $file = [IO.File]::OpenRead($path)
    try {
        $first = 0L
        $last = $file.Length - 1
        $status = '200 OK'
        $headers = "Content-Type: $($types[$ext])`r`nAccept-Ranges: bytes`r`n"
        if ($range -match '^bytes=([0-9]{0,18})-([0-9]{0,18})$' -and ($Matches[1] -or $Matches[2])) {
            if (!$Matches[1]) { $first = [Math]::Max(0L, $file.Length - [long]$Matches[2]) }
            else {
                $first = [long]$Matches[1]
                if ($Matches[2]) { $last = [Math]::Min($last, [long]$Matches[2]) }
            }
            if ($first -gt $last) {
                Send-Headers $stream '416 Range Not Satisfiable' 0 "Content-Range: bytes */$($file.Length)`r`n"
                return
            }
            $status = '206 Partial Content'
            $headers += "Content-Range: bytes $first-$last/$($file.Length)`r`n"
        }
        $remaining = $last - $first + 1
        Send-Headers $stream $status $remaining $headers
        if ($method -eq 'HEAD') { return }
        $file.Position = $first
        $buffer = [byte[]]::new(65536)
        while ($remaining -gt 0) {
            $size = $file.Read($buffer, 0, [int][Math]::Min($remaining, $buffer.Length))
            if (!$size) { break }
            $stream.Write($buffer, 0, $size)
            $remaining -= $size
        }
    } finally {
        $file.Dispose()
    }
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
try {
    $listener.Start()
    $url = "http://127.0.0.1:$port/index.html"
    Write-Host "Open $url. Leave this window open while using the dictionary."
    if (!$NoBrowser) { Start-Process $url }
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try { Send-File $client } catch { Write-Verbose $_ } finally { $client.Close() }
    }
} finally {
    $listener.Stop()
}
