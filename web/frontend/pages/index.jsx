import { useState } from "react";
import { Page, Layout, Card, TextContainer, Button, Spinner } from "@shopify/polaris";

export default function HomePage() {
  const [loading, setLoading] = useState(false);

  const handleRedirect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sso-token'); // Fetch SSO token from backend
      if (!response.ok) {
        throw new Error('Failed to fetch SSO token');
      }
      const { token, shop } = await response.json();
      const externalUrl = `https://shopify-digital-download.fly.dev/external/sso?shop=${shop}&token=${token}`;

      // Open in a new tab
      window.open(externalUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert("Failed to redirect. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Page title="Welcome to Your Digital Delivery App">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <h2>Manage Your Digital Assets</h2>
              <p>
                Welcome! Click the button below to go to the admin panel where you can
                upload, manage, and deliver your digital products efficiently.
              </p>
              <Button primary onClick={handleRedirect} disabled={loading}>
                {loading ? <Spinner size="small" /> : "Go to External Dashboard"}
              </Button>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
