import "server-only";

import { createHash } from "node:crypto";
import { TUTOR_CONTRACT_SNAPSHOT } from "./tutor-contract";

export function getTutorContractHash() {
  return createHash("sha256")
    .update(JSON.stringify(TUTOR_CONTRACT_SNAPSHOT), "utf8")
    .digest("hex");
}
