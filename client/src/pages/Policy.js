import React from "react";
import Layout from "./../components/Layout";

// Credit: ChatGPT was used to generate some policy ideas, as well as correct grammatical errors
// The formatting of the elements are done by myself

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="row policy">
        <h1 className="bg-dark p-2 text-white text-center">PRIVACY POLICY</h1>
        <div style={{ padding: "0 2em" }}>
          <p style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "1em"}}>
            Your privacy is important to us. These policies explain how
            we collect, use, and protect your personal information when you
            use our e-commerce platform.
          </p>

          <h3>1. Information We Collect</h3>
          <p>
            We may collect personal information such as your name, email
            address, phone number, and shipping details when you place an
            order or register an account. We also collect information
            automatically through cookies and analytics tools.
          </p>

          <h3>2. How We Use Your Information</h3>
          <p>
            The information collected is used to process orders, provide
            customer support, improve our website, and send promotional
            offers. We do not sell your personal information to third parties.
          </p>

          <h3>3. Data Security</h3>
          <p>
            We implement reasonable security measures to protect your
            personal data. However, no method of transmission over the
            Internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h3>4. Cookies</h3>
          <p>
            We use cookies to enhance your browsing experience and to
            understand how users interact with our website.
          </p>

          <h3>5. Your Rights</h3>
          <p>
            You have the right to access, update, or delete your personal
            information. You may also opt out of marketing communications at
            any time.
          </p>
          
          <h3>6. Contact Us</h3>
          <p>
            If you have questions about these policies or your personal
            information, please contact us!
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;