import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface MagicLinkEmailProps {
  magicLink: string;
  name?: string;
  expiryMinutes?: number;
}

export const MagicLinkEmail: React.FC<MagicLinkEmailProps> = ({
  magicLink,
  name,
  expiryMinutes = 15,
}) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Connexion à votre espace</Heading>
        </Section>

        <Section style={content}>
          <Text style={paragraph}>
            {name ? `Bonjour ${name},` : 'Bonjour,'}
          </Text>
          
          <Text style={paragraph}>
            Cliquez sur le bouton ci-dessous pour vous connecter à votre espace. 
            Ce lien est valide pendant <strong>{expiryMinutes} minutes</strong>.
          </Text>

          <Button style={button} href={magicLink}>
            Se connecter
          </Button>

          <Text style={smallText}>
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
          </Text>
          
          <Text style={link}>
            {magicLink}
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Si vous n&apos;avez pas demandé cette connexion, vous pouvez ignorer cet email en toute sécurité.
          </Text>
          <Text style={footerSmall}>
            © {new Date().getFullYear()} Gilet Conseils. Tous droits réservés.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  margin: 0,
};

const content = {
  backgroundColor: '#ffffff',
  padding: '40px 30px',
  borderRadius: '0 0 8px 8px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 40px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px 0 10px',
};

const link = {
  color: '#667eea',
  fontSize: '14px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
  marginTop: '20px',
  borderRadius: '8px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
};

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '10px 0 0',
};

