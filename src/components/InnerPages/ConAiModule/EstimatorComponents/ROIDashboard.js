import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import MultiplierCards from './MultiplierCards';
import OperationalMetrics from './OperationalMetrics';
import CostSavingsBreakdown from './CostSavings';
import ROISummary from './ROISummary';
import FinancialProjection from './FinalProjection';
import usePermissions from '../../../Common/usePermissions';
import { useROI } from './ROIContext';
import { GeneratePdf } from '../../../../services/techus-services';
import { getPdfAssets } from '../../../../utils/pdfAssets';
import CONFIG from '../../../../config/config';
// ── Download helper ────────────────────────────────────────────────────────────
const triggerDownload = (arrayBuffer, filename) => {
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

// ── Component ──────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { results, formData } = useROI();
const {permissions,packagePermissions}=usePermissions('roi_calculator','estimate_builder');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);


   const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);
 
   const remoteImageUrl = organizationImage
     ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
      : `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/logo.png`;

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const { coverBg, aiIconBase64 } = await getPdfAssets(); // ← fetched + cached
      const toNum = (str) => parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0;
      const summaryById = (id) =>
        toNum(results.roiSummaryMetrics?.find(m => m.id === id)?.value);
      const payload = {
        type: 'roi',   
        companyName: formData?.companyName || 'ACME INC.',
        coverBg,              
       remoteImageUrl,
        aiIconBase64,
        roiMultiplier: toNum(results.roiMultiplier),      
        totalAnnualSavings: toNum(results.totalAnnualSavings), 
        paybackPeriod: toNum(results.paybackPeriod),       
        netAnnualBenefit: toNum(results.netAnnualBenefit), 
        activeCard: 'roi', 
        timeSaved: toNum(results.timeSavedPerTakeoff),  
        kpiHours: toNum(results.annualHoursSaved),     
        additionalJobs: toNum(results.additionalJobsWon),    
        additionalRevenue: toNum(results.additionalRevenue),    

        // Cost savings breakdown — map costSavingsRows to PDF shape
        costBreakdown: (results.costSavingsRows || []).map(row => ({
          label: row.label,
          proportion: row.pct,              
          annualSavings: toNum(row.value),    
        })),

        // ROI Summary — pull from roiSummaryMetrics array by id
        totalCostOfOwnership: summaryById(4),  
        netROI: summaryById(2),  // id:2 "Net Annual Benefit" (used as Net ROI $)
        totalPaybackPeriod: toNum(          // id:6 "0.9 weeks"
          results.roiSummaryMetrics?.find(m => m.id === 6)?.value
        ),

        // 5-Year projection — map projectionYears to PDF shape
        cumulativeSavings: toNum(results.fiveYearCumulative),  // "$14,073,250" → 14073250
        projections: (results.projectionYears || []).map(y => ({
          label: y.label,
          value: toNum(y.value),   // "$2,814,650" → 2814650
        })),

        // Footer
        footerNote: 'This report is powered by PrexoAI. ',
      };

      const arrayBuffer = await GeneratePdf(payload);
      console.log('type:', typeof arrayBuffer);
      console.log('is ArrayBuffer:', arrayBuffer instanceof ArrayBuffer);
      console.log('value:', arrayBuffer);
      triggerDownload(arrayBuffer, 'ROI-Calculator-Report.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(
        err?.response?.data?.error || err.message || 'Export failed. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };
  void packagePermissions
  return (
    <div className="tw-min-h-screen">
      <div className="tw-mx-auto">

        {/* Top bar */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
          <button
            onClick={() => navigate(-1)}
            className="tw-text-sm tw-text-gray-500 tw-border tw-border-[#999] tw-px-3 tw-py-1 tw-rounded-[5px] tw-bg-white hover:tw-bg-gray-50 tw-transition-colors"
          >
            <i className="icon-Previous tw-mb-[-2px]" /> <span>Back to Input</span>
          </button>

          <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                  {permissions?.export &&(
            <button
              onClick={handleExport}
              disabled={exporting}
              className="tw-flex tw-items-center tw-gap-2 tw-w-[175px] tw-px-6 tw-py-2 tw-bg-[#0140c1] tw-text-white tw-rounded-md tw-text-[15px] hover:tw-bg-blue-800 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
            >
              {exporting
                ? <Loader2 size={16} className="tw-animate-spin" />
                : <Download size={16} />}
              {exporting ? 'Exporting…' : 'Export to PDF'}
            </button>
                  )}
            {exportError && (
              <span className="tw-text-xs tw-text-red-600">{exportError}</span>
            )}
          </div>
        </div>

        {/* Dashboard sections */}
        <MultiplierCards />
        <OperationalMetrics />

        <div className="tw-mb-6">
          <CostSavingsBreakdown />
        </div>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
          <ROISummary />
          <FinancialProjection />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;