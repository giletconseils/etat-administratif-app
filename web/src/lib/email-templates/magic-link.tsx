import * as React from 'react';

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
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8"/>
    </head>
    <body style={{
      backgroundColor: '#f6f9fc',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
      margin: 0,
      padding: 0,
    }}>
      <table role="presentation" style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#f6f9fc',
      }}>
        <tr>
          <td align="center" style={{ padding: '40px 0' }}>
            <table role="presentation" style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <tr>
                <td style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '40px 30px',
                  textAlign: 'center',
                }}>
                  <h1 style={{
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: '600',
                    margin: 0,
                  }}>
                    Connexion à votre espace
                  </h1>
                </td>
              </tr>

              {/* Body */}
              <tr>
                <td style={{ padding: '40px 30px' }}>
                  <p style={{
                    color: '#374151',
                    fontSize: '16px',
                    lineHeight: '24px',
                    margin: '0 0 20px',
                  }}>
                    {name ? `Bonjour ${name},` : 'Bonjour,'}
                  </p>
                  
                  <p style={{
                    color: '#374151',
                    fontSize: '16px',
                    lineHeight: '24px',
                    margin: '0 0 30px',
                  }}>
                    Cliquez sur le bouton ci-dessous pour vous connecter à votre espace. 
                    Ce lien est valide pendant <strong>{expiryMinutes} minutes</strong>.
                  </p>

                  {/* CTA Button */}
                  <table role="presentation" style={{ width: '100%' }}>
                    <tr>
                      <td align="center" style={{ paddingBottom: '30px' }}>
                        <a
                          href={magicLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: '#667eea',
                            borderRadius: '6px',
                            color: '#ffffff',
                            display: 'inline-block',
                            fontSize: '16px',
                            fontWeight: '600',
                            padding: '14px 40px',
                            textDecoration: 'none',
                            textAlign: 'center',
                          }}
                        >
                          Se connecter
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    lineHeight: '20px',
                    margin: '0 0 10px',
                  }}>
                    Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                  </p>
                  
                  <p style={{
                    color: '#667eea',
                    fontSize: '14px',
                    lineHeight: '20px',
                    margin: 0,
                    wordBreak: 'break-all',
                  }}>
                    {magicLink}
                  </p>
                </td>
              </tr>

              {/* Footer */}
              <tr>
                <td style={{
                  backgroundColor: '#f9fafb',
                  padding: '30px',
                  textAlign: 'center',
                  borderTop: '1px solid #e5e7eb',
                }}>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    lineHeight: '20px',
                    margin: 0,
                  }}>
                    Si vous n&apos;avez pas demandé cette connexion, vous pouvez ignorer cet email en toute sécurité.
                  </p>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: '18px',
                    margin: '10px 0 0',
                  }}>
                    © {new Date().getFullYear()} Gilet Conseils. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
);

