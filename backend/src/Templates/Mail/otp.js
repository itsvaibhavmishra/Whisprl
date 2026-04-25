export default (name, otp) => {
  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
        margin: 0;
        padding: 0;
      }

      .header {
        position: relative;
        background-image: url("https://i.imgur.com/jvSDsi9.jpg");
        background-size: contain;
        padding: 20px;
        text-align: center;
        color: #333;
        -webkit-text-stroke-width: 0.5px;
        -webkit-text-stroke-color: #ccc;
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

      .otp-content {
        text-align: center;
      }

      .otp-text {
        font-size: 24px;
        color: #333;
        margin-bottom: 10px;
      }

      .otp-number {
        font-size: 24px;
        color: #fff;
        background-color: rgba(0, 123, 255, 0.7);
        border-radius: 50%;
        width: 42px;
        height: 42px;
        line-height: 42px;
        margin: 2px;
        display: inline-block;
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
          <div class="otp-content">
            <div class="note">
              <p>Hey ${name},</p>
            </div>
            <div class="otp-text">Your One-Time Password (OTP):</div>
  
            ${otp
              .split("")
              .map((digit) => `<div class="otp-number">${digit}</div>`)
              .join("")}
          </div>
          <div class="note">
            <p>Use this OTP to complete your verification process.</p>
          </div>
        </div>
        <div class="footer">
          <p>If you didn't request this OTP, please ignore this email.</p>
          <p>
            For any assistance, please contact
            <a href="mailto:whisprl@gmail.com">whisprl@gmail.com</a>.
          </p>
        </div>
      </body>
    </html>
  
    `;
};
