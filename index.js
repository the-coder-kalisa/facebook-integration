const express = require("express");
const Facebook = require("facebook-js-sdk");
const https = require("https");
const forge = require("node-forge");


// step 1: initialize Facebook class with config

(function main() {
  const server = https.createServer(
    generateX509Certificate([
      { type: 6, value: "http://localhost" },
      { type: 7, ip: "127.0.0.1" },
    ]),
    makeExpressApp()
  );
  server.listen(5000, () => {
    console.log("Listening on https://localhost:5000/");
  });
})();
function makeExpressApp() {
  const app = express();
  const facebook = new Facebook({
    appId: "848792613033343",
    appSecret: "4a87bb67827f7b22b775d48d7e5efc83",
    redirectUrl: "https://localhost:5000/callback",
    graphVersion: "v8.0",
  });
  app.get("/login", function (req, res) {
    res.end('<a href="' + facebook.getLoginUrl() + '">Login</a>');
  });

  // step 3: oauth login redirects back to callback page and we send code GET param to facebook.callback() and fetch access_token

  app.get("/callback", function (req, res) {
    if (req.query.code) {
      facebook
        .callback(req.query.code)
        .then((response) => {
          console.log(response);
          res.send(response.data.access_token); // store access_token in database for later use
        })
        .catch((error) => {
          console.log(error);
          res.send(error.response.data);
        });
    }
  });

  // step 4: use facebook.get() facebook.post() and facebook.delete() for GET, POST and DELETE requests

  app.get("/", function (req, res) {
    // fetch access_token from database and set it using facebook.setAccessToken() for all future requests

    facebook.setAccessToken(
      "EAAMDZBO4wFX8BALsqXU5E5qIhyd6ZAjo8kkSJDVEact07SZAMOjBhElwTY0U9EQIlDTusBC8xcJt01VPiY8zVPHJ6ZBJWaUtAvTIw3gpX0YlltikhmcZBpcrQVRWfwsISkkhG2yqcb4QS5W6A1Sgs4xSmyjVElLjfRhNAQeuDuD3DSncZBtZCxkPoD1Mki74SgvpYy3LKPhn9z5dK85OjpR1bIRSerSWYqQFEREu49LjQZDZD"
    );

    facebook
      .get("/me?fields=id,first_name,last_name,user_friends")
      .then((response) => {
        console.log(response.data);
        var name = response.data.name;
        res.send(response.data);
      })
      .catch((error) => {
        console.log(error);
        res.send("not found");
      });

    // facebook
    //   .post(
    //     "/page-id-here/feed",
    //     {
    //       message: "This is post message.",
    //     },
    //     "page-secert-access-token"
    //   )
    //   .then((response) => {
    //     res.send(response.data);
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     res.send(error.response.data);
    //   });

    // facebook
    //   .delete("/object-id-here")
    //   .then((response) => {
    //     res.send(response.data);
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     res.send(error.response.data);
    //   });
  });
  return app;
}
function generateX509Certificate(altNames) {
  const issuer = [
    { name: "commonName", value: "example.com" },
    { name: "organizationName", value: "E Corp" },
    { name: "organizationalUnitName", value: "Washington Township Plant" },
  ];
  const certificateExtensions = [
    { name: "basicConstraints", cA: true },
    {
      name: "keyUsage",
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: "nsCertType",
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true,
    },
    { name: "subjectAltName", altNames },
    { name: "subjectKeyIdentifier" },
  ];
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  cert.publicKey = keys.publicKey;
  cert.setSubject(issuer);
  cert.setIssuer(issuer);
  cert.setExtensions(certificateExtensions);
  cert.sign(keys.privateKey);
  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert),
  };
}
