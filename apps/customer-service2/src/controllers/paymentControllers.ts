import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paymentService } from "../services/paymentService";

export const getNotify: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await paymentService.handleNotify(req.body);
  res.json({ ok: true });
});

export const getCallBack: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const reference = req.query.reference as string;
  const process_status = req.query.process_status as string;

  const { url } = await paymentService.getCallbackRedirectUrl(reference, process_status);
  const linkResult = JSON.stringify(url);

  res.send(`
    <html>
      <body>
        <script>
          location.replace(${linkResult})
        </script>
      </body>
    </html>
  `);
});
