import {
  reactExtension,
  Banner,
  useOrder,
  Button,
  BlockStack,
  Text,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'customer-account.order-status.block.render',
  () => <Extension />,
);

function Extension() {
  const order = useOrder();

  if (order) {
    // Extract the numeric part from the full order ID string
    const orderIdFull = order.id; // e.g., "gid://shopify/OrderIdentity/6993004167230"
    const cleanOrderId = orderIdFull.split('/').pop();
    const downloadUrl = `https://shopify-digital-download.fly.dev/orders/${cleanOrderId}`;

    return (
      <Banner status="info">
        <BlockStack gap="4">
          <Text>Your Puchase is Ready to Download</Text>
          <Button to={downloadUrl}>Download Order</Button>
        </BlockStack>
      </Banner>
    );
  }

  return null;
}
