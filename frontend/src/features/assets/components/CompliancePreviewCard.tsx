/**
 * Compliance Preview Card Component
 * 
 * Displays real-time compliance score and feedback based on form data.
 */

import React from 'react';
import { FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import {
    CompliancePreview,
    getComplianceScoreColor,
    getComplianceScoreBg
} from '../../services/complianceService';

interface CompliancePreviewCardProps {
    compliancePreview: CompliancePreview;
}

const CompliancePreviewCard: React.FC<CompliancePreviewCardProps> = ({ compliancePreview }) => {
    const complianceScoreColor = getComplianceScoreColor(compliancePreview.score);
    const complianceScoreBg = getComplianceScoreBg(compliancePreview.score);

    return (
        <div className={`card border-2 ${complianceScoreBg}`}>
            <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <FiShield className="text-2xl text-primary-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Live Compliance Preview</h3>
                            <p className="text-sm text-gray-600">Real-time compliance score based on form data</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-bold ${complianceScoreColor}`}>
                            {compliancePreview.score}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">Score</div>
                    </div>
                </div>

                {compliancePreview.issues.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FiAlertTriangle className="text-red-600" />
                            <span className="font-semibold text-red-700">Issues</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                            {compliancePreview.issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {compliancePreview.warnings.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FiAlertTriangle className="text-yellow-600" />
                            <span className="font-semibold text-yellow-700">Warnings</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                            {compliancePreview.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {compliancePreview.recommendations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FiCheckCircle className="text-blue-600" />
                            <span className="font-semibold text-blue-700">Recommendations</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                            {compliancePreview.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompliancePreviewCard;
