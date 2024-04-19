const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log(`REQUEST -- EVENT:: ${JSON.stringify(event, null, 2)}`);

  if (event.body) {
    console.log("Entra a POST");
    const base64Image = event.body.image;
    const buffer = Buffer.from(base64Image, "base64");

    const params = {
      Bucket: "dataimagesecgroup", // Nombre de tu bucket
      Key: event.body.id, // Nombre del archivo en S3
      Body: buffer,
      ContentType: event.body.type,
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
          },
        body: JSON.stringify({ message: "Imagen subida correctamente" }),
      };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Error al subir la imagen" }),
      };
    }
  } else if (event.pathParameters) {
    console.log("Entra a DELETE");
    const params = {
      Bucket: "dataimagesecgroup",
      Key: event.pathParameters.name,
    };

    try {
      const data = await s3.deleteObject(params).promise();
      return {
        statusCode: 200,
        body: "Se eliminó imagen correctamente",
      };
    } catch (err) {
      console.log(err);
      return {
        statusCode: 404,
        body: "No se pudo eliminar la imagen",
      };
    }
  } else {
    console.log("Entra a GET");
    const params = {
      Bucket: "dataimagesecgroup",
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      if (data.Contents.length > 0) {
        const imageUrls = await Promise.all(
          data.Contents.map((item) => {
            return new Promise((resolve, reject) => {
              const urlParams = {
                Bucket: "dataimagesecgroup",
                Key: item.Key,
                Expires: 3600,
              };
              s3.getSignedUrl("getObject", urlParams, function (err, url) {
                if (err) reject(err);
                else resolve({url, ...urlParams});
              });
            });
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify(imageUrls),
        };
      } else {
        return {
          statusCode: 404,
          body: "No se encontraron elementos",
        };
      }
    } catch (err) {
      console.log(err);
      return {
        statusCode: 500,
        body: "Error al listar los objetos",
      };
    }
  }
};
