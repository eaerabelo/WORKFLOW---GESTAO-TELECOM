import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: "mlsn.a25feb8af29d7f19472dd574a607354c9fa6bca836169c726bef1501a839b589"
});

const sentFrom = new Sender("nao-responda@test-pzkmgq7me52l059v.mlsender.net", "Workflow Gestão");
const recipients = [new Recipient("teste@corporativo.com.br", "Teste")];

const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setSubject("Test Email")
  .setHtml("<p>Testing</p>");

mailerSend.email.send(emailParams)
  .then(console.log)
  .catch(err => {
    console.error("ERROR:");
    console.error(err);
    if (err.body) console.error(err.body);
  });
