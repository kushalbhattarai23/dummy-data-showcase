import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Wallet, 
  Tag, 
  Calendar,
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { CategoriesReport } from './CategoriesReport';
import { WalletsReport } from './WalletsReport';
import { TransactionsReport } from './TransactionsReport';
import { IncomeExpenseReport } from './IncomeExpenseReport';
import { MonthlyReport } from './MonthlyReport';
import { TransfersReport } from './TransfersReport';

type ReportType = 
  | 'overview'
  | 'categories' 
  | 'wallets' 
  | 'transactions' 
  | 'income-expense'
  | 'monthly'
  | 'transfers';

interface ReportMenuItem {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const reportMenuItems: ReportMenuItem[] = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'General financial overview',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'text-blue-600'
  },
  {
    id: 'categories',
    title: 'Categories Report',
    description: 'Spending by category',
    icon: <Tag className="w-5 h-5" />,
    color: 'text-purple-600'
  },
  {
    id: 'wallets',
    title: 'Wallets Report',
    description: 'Wallet balances and activity',
    icon: <Wallet className="w-5 h-5" />,
    color: 'text-green-600'
  },
  {
    id: 'transactions',
    title: 'Transactions Report',
    description: 'Detailed transaction analysis',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-orange-600'
  },
  {
    id: 'income-expense',
    title: 'Income vs Expense',
    description: 'Income and expense trends',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-red-600'
  },
  {
    id: 'monthly',
    title: 'Monthly Report',
    description: 'Month-by-month breakdown',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-indigo-600'
  },
  {
    id: 'transfers',
    title: 'Transfers Report',
    description: 'Wallet transfer analysis',
    icon: <ArrowUpDown className="w-5 h-5" />,
    color: 'text-teal-600'
  }
];

export const ReportsDashboard: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('overview');

  const renderReportContent = () => {
    switch (activeReport) {
      case 'categories':
        return <CategoriesReport />;
      case 'wallets':
        return <WalletsReport />;
      case 'transactions':
        return <TransactionsReport />;
      case 'income-expense':
        return <IncomeExpenseReport />;
      case 'monthly':
        return <MonthlyReport />;
      case 'transfers':
        return <TransfersReport />;
      case 'overview':
      default:
        return <ReportsOverview onSelectReport={setActiveReport} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-2">
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Reports</h2>
              <nav className="space-y-1">
                {reportMenuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeReport === item.id ? 'default' : 'ghost'}
                    className={`w-full justify-start text-left h-auto p-3 ${
                      activeReport === item.id 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'hover:bg-green-50'
                    }`}
                    onClick={() => setActiveReport(item.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={activeReport === item.id ? 'text-white' : item.color}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className={`text-xs ${
                          activeReport === item.id ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Component
const ReportsOverview: React.FC<{ onSelectReport: (report: ReportType) => void }> = ({ onSelectReport }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Financial Reports</h1>
        <p className="text-green-700 mt-2 text-sm sm:text-base">
          Comprehensive analysis of your financial data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {reportMenuItems.slice(1).map((item) => (
          <Card 
            key={item.id}
            className="hover:shadow-lg transition-shadow cursor-pointer border-green-200"
            onClick={() => onSelectReport(item.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-50 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg text-green-900">
                    {item.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{item.description}</p>
              <Button 
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                View Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
