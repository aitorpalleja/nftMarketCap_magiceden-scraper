const express = require('express');
const mongoose = require('mongoose');
import dotenv from 'dotenv'
dotenv.config()
const mongodbRoute = process.env.MONGO_DB_URI
const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(function (req: any, res: { header: (arg0: string, arg1: string) => void; }, next: () => void) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
})

/*MONGODB*/
const options = {
  socketTimeoutMS: 0,
  keepAlive: true,
  //reconnectTries: 30,
  useNewUrlParser: true
};
mongoose.Promise = global.Promise
mongoose.connect(mongodbRoute, options, (err: any) => {
  if (err) {
    return console.log(`Error al conectar a la base de datos: ${err}`)
  }
  app.listen(port, () => {
    console.log(`Servidor up en ${port}`);
  });
  console.log(`Conexión con Mongo correcta.`)
})
