const getRegisterEmailHtml = (verificationUrl) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background-color: #008080; padding: 25px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">
          bid <span style="color: #F5DEB3;">'n'</span> buy
        </h1>
      </div>
      
      <!-- Body Content -->
      <div style="padding: 30px; color: #333333;">
        <h2 style="margin-top: 0; color: #8B4513;">Welcome aboard!</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          We're thrilled to have you. Before you start bidding and buying, please verify your email address to secure your account.
        </p>
        
        <!-- CTA Button -->
        <a href="${verificationUrl}" style="display: inline-block; background-color: #8B4513; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: bold; font-size: 16px;">
          Verify My Email
        </a>
        
        <!-- Fallback Link -->
        <p style="font-size: 14px; color: #888888; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #008080; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9f9f9; padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">
        <p style="margin: 0;">If you didn't create an account with bid 'n' buy, you can safely ignore this email.</p>
      </div>
      
    </div>
  </div>
  `;
};

module.exports = getRegisterEmailHtml;
