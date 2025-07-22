# install

```sh
npm install sequelize mysql2
```

```sh
npm install --save-dev sequelize-cli typescript ts-node @types/node
```

# create folder
```sh
npx sequelize-cli init --migrations-path src/migrations --seeders-path src/seeders --models-path src/models
```

# about this flow
```sh
1.  ถ้าแก้ config ให้ npm run build ก่อน เพราะ .sequelizerc ชี้ไปที่ dist

2. สร้าง migration, seeder, model ได้
3. model/index.ts มีไว้ export model ให้ backend เอาไปใช้
```
