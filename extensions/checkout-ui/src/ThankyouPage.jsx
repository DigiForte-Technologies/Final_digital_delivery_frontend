import {
    reactExtension,
    useApi,
    Banner,
    BlockStack,
    Button,
    Text,
  } from '@shopify/ui-extensions-react/checkout';
  
  export default reactExtension(
    'purchase.thank-you.block.render',
    () => <Extension />
  );
  
  function Extension() {
    const api = useApi();
    // Access orderConfirmation instead of using useOrder()
    const orderId = api.orderConfirmation?.current?.order?.id;
    const cleanOrderId = orderId.split('/').pop();
    const downloadUrl = `https://shopify-digital-download.fly.dev/orders/${cleanOrderId}`;
  
    return orderId ? (
           <Banner status="info">
             <BlockStack gap="4">
               <Text>Your Puchase is Ready to Download</Text>
               <Button to={downloadUrl}>Download Order</Button>
             </BlockStack>
           </Banner>
    ) : null;
  }
  