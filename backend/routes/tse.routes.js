// routes/tse.routes.js
const express = require("express");
const router = express.Router();
const tseController = require("../controllers/tse.controller");

router.get("/consulta-cedula/:cedula", tseController.getConsultaCedula);

module.exports = router;