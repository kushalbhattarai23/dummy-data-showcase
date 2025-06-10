
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Users } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 text-lg">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <div className="text-sm text-gray-500 mt-2">
            Last updated: June 10, 2025
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Eye className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-xl">Information We Collect</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-600">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us. This may include your email address, username, and profile information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
                <p className="text-gray-600">
                  We collect information about how you use Track Hub, including your TV show tracking data, 
                  financial transactions, and interaction with our features.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-green-600" />
                <CardTitle className="text-xl">How We Use Your Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>To provide, maintain, and improve our services</li>
                <li>To personalize your experience and recommendations</li>
                <li>To communicate with you about updates and features</li>
                <li>To ensure the security and integrity of our platform</li>
                <li>To comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-purple-600" />
                <CardTitle className="text-xl">Information Sharing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this policy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>With service providers who assist us in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
                <a href="mailto:privacy@trackhub.com" className="text-blue-600 hover:underline">
                  privacy@trackhub.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
