import { Router } from "express";

import { uploadCsv } from "../middleware/uploadMiddleware";
import { importCsv, getCsvPage } from "../controllers/csvController";

const router = Router();

router.post("/import", uploadCsv, importCsv);
router.get("/import/:dataId", getCsvPage);

export default router;
