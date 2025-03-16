import { useEffect, useState } from "react";
import { Page, Layout, Card, TextContainer, Button, Spinner } from "@shopify/polaris";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState("");

  useEffect(() => {
    async function registerWebhook() {
      try {
        const response = await fetch("/api/register-webhook");
        const data = await response.json();
        setWebhookStatus(data.message);
      } catch (err) {
        console.error("Webhook registration failed:", err);
        setWebhookStatus("Webhook registration failed.");
      }
    }

    registerWebhook();
  }, []);

  const handleRedirect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sso-token');
      if (!response.ok) throw new Error('Failed to fetch SSO token');
      const { token, shop } = await response.json();
      window.open(`https://shopify-digital-download.fly.dev/external/sso?shop=${shop}&token=${token}`, '_blank');
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
              <p>{webhookStatus}</p>
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
