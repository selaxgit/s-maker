ng build --base-href "./" --configuration production
Set-Location electron
Remove-Item -Recurse -Force ./dist/
Copy-Item -Recurse ../dist/s-maker/browser/ ./dist/
npm run package
