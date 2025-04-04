rm package-lock.json
git pull origin dev
npm i
npm run build
pm2 delete restat-backend-staging
pm2 start npm --name "restat-backend-staging" -- start
