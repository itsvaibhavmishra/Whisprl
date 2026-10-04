export default (name, reset) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Password Template</title>
      <style type="text/css">

        :root {
          color-scheme: light only;
        }

        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          margin: 0;
          padding: 0;
        }

        .header {
          color-scheme: light only;
          position: relative;
          background-image: url("https://i.imgur.com/jvSDsi9.jpg");
          background-size: contain;
          padding: 20px;
          text-align: center;
          color: #000 !important;
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 5px;
          text-shadow: 0.5px 0.5px 5px #fff;
          margin-top: -20px;
          margin-left: -20px;
          margin-right: -20px;
          position: relative;
          z-index: 1;
        }

        .container {
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .logo {
          text-align: center;
          margin-bottom: 20px;
          margin: 5px;
        }

        .logo img {
          max-width: 100px;
        }

        .reset-content {
          text-align: center;
        }

        .reset-text {
          font-size: 24px;
          color: #333;
          margin-bottom: 10px;
        }

        .reset-button {
          display: inline-block;
          outline: 0;
          border: none;
          padding: 0 56px;
          height: 45px;
          line-height: 45px;
          text-decoration: none;
          border-radius: 7px;
          background-color: #212b36;
          color: white;
          font-weight: 400;
          font-size: 16px;
          box-shadow: 0 4px 2px 0 #29313a;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .reset-link {
          display: block;
          padding-top: 15px;
          color: #0070f3;
          text-decoration: none;
          max-width: 80%;
          margin: 0 auto;
          white-space: normal;
        }

        .note {
          text-align: center;
          font-size: 14px;
          color: #777;
          margin-top: 20px;
        }

        .footer {
          text-align: center;
          width: 100%;
          margin-top: 30px;
        }

        .footer a {
          color: #007bff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Welcome to Whisprl</div>
        <div class="logo">
          <a href="https://whisprl.netlify.app/">
            <img src="https://i.imgur.com/KZkoFRO.png" alt="Whisprl Logo" />
          </a>
        </div>
        <div class="reset-content">
          <div class="note">
            <p>Hey ${name},</p>
          </div>
          <div class="reset-text">Link To Reset Your Password:</div>
          <!--[if mso
            ]><style>
              .v-button {
                background: transparent !important;
              }
            </style><!
          [endif]-->
          <div align="center">
            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${reset}" style="height:56px; v-text-anchor:middle; width:156px;" arcsize="7%"  stroke="f" fillcolor="#115581"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Cabin',sans-serif;"><![endif]-->
            <a
              href="${reset}"
              target="_blank"
              class="v-button"
              style="
                box-sizing: border-box;
                display: inline-block;
                font-family: 'Cabin', sans-serif;
                text-decoration: none;
                -webkit-text-size-adjust: none;
                text-align: center;
                color: #ffffff;
                background-color: #212b36;
                border-radius: 4px;
                -webkit-border-radius: 4px;
                -moz-border-radius: 4px;
                width: auto;
                max-width: 100%;
                overflow-wrap: break-word;
                word-break: break-word;
                word-wrap: break-word;
                font-size: 14px;
              "
            >
              <span style="display: block; padding: 20px 32px; line-height: 120%"
                ><span style="line-height: 16.8px">Reset Password</span></span
              >
            </a>
            <!--[if mso]></center></v:roundrect><![endif]-->
          </div>
          <a class="reset-link" href="${reset}" target="_blank">${reset}</a>
        </div>
        <div class="note">
          <p>Click on this button or Use this link to reset your password.</p>
          <p>This link is only valid for 10mins</p>
        </div>
      </div>
      <div class="footer">
        <p>If you didn't request this Reset Link, please ignore this email.</p>
        <p>
          For any assistance, please contact
          <a href="mailto:whisprl@gmail.com">whisprl@gmail.com</a>.
        </p>
      </div>
    </body>
  </html>
    `;
};
