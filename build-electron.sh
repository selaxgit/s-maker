ng build --base-href "./"  --configuration production
cd electron
rm -rf ./dist/
cp -r ../dist/s-maker/browser/ ./dist/
npm run package