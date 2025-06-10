
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, AlertTriangle, Users } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 text-lg">
            Please read these terms carefully before using Track Hub.
          </p>
          <div className="text-sm text-gray-500 mt-2">
            Last updated: June 10, 2025
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Scale className="w-6 h-6 text-green-600" />
                <CardTitle className="text-xl">Acceptance of Terms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                By accessing and using Track Hub, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-xl">Use License</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Permission is granted to temporarily use Track Hub for personal, non-commercial transitory viewing only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times.
              </p>
              <p className="text-gray-600">
                You are responsible for safeguarding the password and for keeping your account information current. 
                You agree not to disclose your password to any third party.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Content and Conduct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                You are responsible for any content you submit, post, or display on Track Hub. You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Post content that is illegal, harmful, or violates others' rights</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use automated systems to access the service</li>
                <li>Attempt to gain unauthorized access to other users' accounts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <CardTitle className="text-xl">Disclaimer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                The materials on Track Hub are provided on an 'as is' basis. Track Hub makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
                implied warranties or conditions of merchantability, fitness for a particular purpose, or 
                non-infringement of intellectual property or other violation of rights.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Limitations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                In no event shall Track Hub or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                to use Track Hub, even if Track Hub or an authorized representative has been notified orally or in writing 
                of the possibility of such damage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice 
                or liability, under our sole discretion, for any reason whatsoever and without limitation, including but 
                not limited to a breach of the Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@trackhub.com" className="text-green-600 hover:underline">
                  legal@trackhub.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
