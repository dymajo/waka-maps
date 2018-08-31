$s3Bucket = "jono-map-test"
$s3Prefix = "dymajo-tiles"
$outputPath = (Join-Path -Path (Get-Item $PSCommandPath ).DirectoryName -ChildPath "output")

# Loops output folder to find all files, and upload them
$files = Get-ChildItem -Recurse -File $outputPath
$count = 0
foreach ($file in $files) {
  $key = $file.FullName.Remove(0, $outputPath.Length).Replace("\","/")
  $count += 1;
  if ($count % 10 -eq 0) {
    echo ($count.ToString() + "/" + $files.Length.ToString())
  }
  # echo $key $file.FullName
  Write-S3Object -BucketName $s3Bucket -File $file.FullName -Key ($s3Prefix + $key)
}
echo "All Files Uploaded!"
