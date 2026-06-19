import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EsignRequest {
  formCode: string;
  formName: string;
  roles: string[];
  values: Record<string, string>;
}

export async function POST(req: Request) {
  let body: EsignRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Stub: in production this would create a DocuSign/HelloSign envelope
  const envelopeId = randomUUID();
  const result = {
    id: envelopeId,
    status: "sent",
    formCode: body.formCode,
    formName: body.formName,
    roles: body.roles,
    sentAt: new Date().toISOString(),
    message: `E-sign envelope ${envelopeId} created for ${body.formName}. Recipients: ${body.roles.join(", ")}.`,
  };

  return Response.json(result, { status: 200 });
}
