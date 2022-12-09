import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fs from "fs";
import util from "util";
import { pipeline } from "stream";

import fastifyEnv from "@fastify/env";



const schema = {
  type: 'object',
  required: ['CLOUDINARY_URL', ],
  properties: {
    CLOUDINARY_URL: {
      type: 'string'
    }
  }
}
const options = {
  dotenv: true,
  schema: schema,
  data: process.env
}

const pump = util.promisify(pipeline);

export const app = Fastify({
  logger: true,
});

// app.register(fastifyEnv, options);
app.register(fastifyEnv, options)
  .ready((err) => {
    if (err) console.error(err)
    console.log("process.env",app.config) 
})

app.register(multipart);

import * as Cloudinary from 'cloudinary'

const credentials = Cloudinary.v2.config({ secure: "true" });
console.log(credentials.cloud_name);
console.log(credentials.api_key);

app.post("/upload", async function (req, reply) {
  const parts = req.parts();

  for await (const part of parts) {
    if (part.file) {
      // upload and save the file
      let result = await pump(
        part.file,
        fs.createWriteStream(`./uploads/${part.filename}`)
      );
      console.log(JSON.stringify(result, null, 2));
      // upload file to Cloudinary
      const photo = await cloudinary.v2.uploader.upload(
        `./uploads/${part.filename}`,
        {
          use_filename: true,
          unique_filename: true,
        }
      );
      console.log("after cloudinary upload", JSON.stringify(photo));
    } else {
      // do something with the non-files parts
    }
  }

  return { messege: "files uploaded" };
});
