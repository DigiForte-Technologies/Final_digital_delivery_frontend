import { Page, Layout, Card, TextContainer, Button } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

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
              <Button
                primary
                onClick={() => {
                  window.open("/sso", "_blank");
                }}
              >
                Go to External Dashboard
              </Button>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
