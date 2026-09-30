import { handleContact, resendSender } from './_lib/handleContact.js'

/** POST /api/contact (logic and env docs in api/_lib/handleContact.ts). */
export async function POST(request: Request) {
  return handleContact(request, resendSender())
}
