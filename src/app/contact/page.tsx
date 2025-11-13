import { Contact2 } from "@/components/ui/contact-2";

export default function Page() {
  return (
    <Contact2
      title="Contact Us"
      description="Sree Sabari Sastha Seva Samithi (SSSSS). In case of any changes / suggestions please mail us sasthasevasamithi@gmail.com"
      address={`Sree Sabari Sastha Seva Samithi (SSSSS)\n68/B, phase-1, Janapriya apartments, Miyapur, Hyderabad 500049\n\nFacebook: Sastha Seva Samithi`}
      phones={["Mobile: +91-9866007840"]}
      emails={["sasthasevasamithi@gmail.com"]}
      web={{ label: "sabarisastha.org", url: "https://sabarisastha.org" }}
    />
  );
}
