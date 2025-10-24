import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
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
        <Text style={greeting}>
          {name ? `Bonjour ${name},` : 'Bonjour,'}
        </Text>
        
        <Text style={paragraph}>
          Cliquez sur le bouton ci-dessous pour vous connecter à votre espace. Ce lien est valide pendant <strong>{expiryMinutes} minutes</strong>.
        </Text>

        <Button style={button} href={magicLink}>
          Se connecter
        </Button>

        <Text style={footer}>
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </Text>
        
        <Text style={link}>
          {magicLink}
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '60px 20px',
  maxWidth: '480px',
};

const greeting = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
  fontWeight: '400',
};

const paragraph = {
  color: '#666666',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 32px',
};

const button = {
  backgroundColor: '#00A7E1',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '500',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '0 0 40px',
};

const footer = {
  color: '#999999',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const link = {
  color: '#00A7E1',
  fontSize: '13px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
  margin: 0,
};

