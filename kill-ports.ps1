$ports = @(5173, 5002)
foreach ($port in $ports) {
    $line = netstat -ano | findstr ":$port"
    if ($line) {
        $parts = $line -split '\s+'
        $procId = $parts[-1]
        Write-Host "Killing process $procId on port $port"
        taskkill /PID $procId /F
    } else {
        Write-Host "No process found on port $port"
    }
}