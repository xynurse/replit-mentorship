import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SONSIEL_TEAL = '#14B8A6';
const SONSIEL_DARK = '#0F172A';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(SONSIEL_TEAL);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SONSIEL Mentorship Hub', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Society of Nurse Scientists, Innovators, Entrepreneurs & Leaders', 14, 28);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_PRIMARY);
  doc.text(title, 14, 50);
  
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY);
    doc.text(subtitle, 14, 58);
  }
}

function addFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_SECONDARY);
  
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  doc.text(`Generated on ${date}`, 14, pageHeight - 10);
  doc.text(`Page ${pageNumber}`, pageWidth - 25, pageHeight - 10);
  doc.text('Confidential - SONSIEL Mentorship Hub', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

export interface GoalData {
  title: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  progress?: number | null;
  targetDate?: string | Date | null;
  specificDetails?: string | null;
  measurableMetrics?: any;
  achievabilityNotes?: string | null;
  relevanceExplanation?: string | null;
  mentorFeedback?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  milestones?: {
    title: string;
    description?: string | null;
    targetDate?: string | Date | null;
    isCompleted?: boolean;
  }[];
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  organizationName?: string | null;
  jobTitle?: string | null;
}

export function exportGoalsToPDF(goals: GoalData[], user: UserInfo, options?: Partial<PDFOptions>) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const filename = options?.filename || `goals-${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}.pdf`;
  const title = options?.title || 'My Goals & Progress';
  const subtitle = `${user.firstName} ${user.lastName} - ${user.email}`;
  
  addHeader(doc, title, subtitle);
  
  let yPos = 70;
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  let pageNumber = 1;
  
  if (goals.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(TEXT_SECONDARY);
    doc.text('No goals have been set yet.', margin, yPos);
  } else {
    goals.forEach((goal, index) => {
      if (yPos > pageHeight - 50) {
        addFooter(doc, pageNumber);
        doc.addPage();
        pageNumber++;
        yPos = 20;
      }
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 5, contentWidth, 12, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(TEXT_PRIMARY);
      doc.text(`${index + 1}. ${goal.title}`, margin + 3, yPos + 2);
      
      const statusColor = getStatusColor(goal.status);
      doc.setFontSize(9);
      doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
      const statusText = formatStatus(goal.status);
      doc.text(statusText, doc.internal.pageSize.getWidth() - margin - doc.getTextWidth(statusText), yPos + 2);
      
      yPos += 15;
      
      if (goal.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(TEXT_SECONDARY);
        const descLines = doc.splitTextToSize(goal.description, contentWidth - 6);
        doc.text(descLines, margin + 3, yPos);
        yPos += (descLines.length * 5) + 3;
      }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_SECONDARY);
      
      const details = [];
      if (goal.category) details.push(`Category: ${formatCategory(goal.category)}`);
      if (goal.targetDate) details.push(`Target: ${formatDate(goal.targetDate)}`);
      if (goal.progress !== null && goal.progress !== undefined) {
        details.push(`Progress: ${goal.progress}%`);
      }
      
      if (details.length > 0) {
        doc.text(details.join('  |  '), margin + 3, yPos);
        yPos += 8;
      }
      
      if (goal.progress !== null && goal.progress !== undefined) {
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(margin + 3, yPos - 2, 80, 4, 1, 1, 'F');
        
        if (goal.progress > 0) {
          doc.setFillColor(SONSIEL_TEAL);
          doc.roundedRect(margin + 3, yPos - 2, Math.min(80, (goal.progress / 100) * 80), 4, 1, 1, 'F');
        }
        yPos += 8;
      }
      
      const addSmartSection = (label: string, content: string | null | undefined, iconChar: string) => {
        if (!content) return;
        if (yPos > pageHeight - 40) {
          addFooter(doc, pageNumber);
          doc.addPage();
          pageNumber++;
          yPos = 20;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(SONSIEL_TEAL);
        doc.text(`${iconChar} ${label}:`, margin + 3, yPos);
        yPos += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(TEXT_SECONDARY);
        const lines = doc.splitTextToSize(content, contentWidth - 10);
        doc.text(lines, margin + 6, yPos);
        yPos += (lines.length * 4) + 3;
      };
      
      const measurableText = typeof goal.measurableMetrics === 'string' 
        ? goal.measurableMetrics 
        : goal.measurableMetrics?.description || null;
      
      addSmartSection('Specific', goal.specificDetails, 'S');
      addSmartSection('Measurable', measurableText, 'M');
      addSmartSection('Achievable', goal.achievabilityNotes, 'A');
      addSmartSection('Relevant', goal.relevanceExplanation, 'R');
      
      if (goal.milestones && goal.milestones.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(TEXT_PRIMARY);
        doc.text('Milestones:', margin + 3, yPos);
        yPos += 5;
        
        goal.milestones.forEach((milestone) => {
          if (yPos > pageHeight - 30) {
            addFooter(doc, pageNumber);
            doc.addPage();
            pageNumber++;
            yPos = 20;
          }
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(TEXT_SECONDARY);
          
          const checkMark = milestone.isCompleted ? '[X]' : '[ ]';
          const milestoneText = `${checkMark} ${milestone.title}`;
          doc.text(milestoneText, margin + 6, yPos);
          
          if (milestone.targetDate) {
            const dateText = formatDate(milestone.targetDate);
            doc.text(dateText, margin + 100, yPos);
          }
          yPos += 5;
        });
        yPos += 3;
      }
      
      if (goal.mentorFeedback) {
        doc.setFillColor(240, 253, 244);
        const feedbackLines = doc.splitTextToSize(`Mentor Feedback: ${goal.mentorFeedback}`, contentWidth - 12);
        const feedbackHeight = feedbackLines.length * 4 + 6;
        doc.roundedRect(margin + 3, yPos - 2, contentWidth - 6, feedbackHeight, 2, 2, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(22, 163, 74);
        doc.text(feedbackLines, margin + 6, yPos + 2);
        yPos += feedbackHeight + 5;
      }
      
      yPos += 10;
    });
  }
  
  addFooter(doc, pageNumber);
  doc.save(filename);
}

export function exportProfileToPDF(user: UserInfo & {
  bio?: string | null;
  phone?: string | null;
  linkedInUrl?: string | null;
  yearsOfExperience?: number | null;
  languagesSpoken?: string[];
  timezone?: string | null;
}, options?: Partial<PDFOptions>) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const filename = options?.filename || `profile-${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}.pdf`;
  const title = options?.title || 'My Profile';
  
  addHeader(doc, title, `${user.firstName} ${user.lastName}`);
  
  let yPos = 70;
  const margin = 14;
  const contentWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 5, contentWidth, 40, 3, 3, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_PRIMARY);
  doc.text(`${user.firstName} ${user.lastName}`, margin + 5, yPos + 3);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(SONSIEL_TEAL);
  if (user.jobTitle) {
    doc.text(user.jobTitle, margin + 5, yPos + 11);
  }
  
  doc.setTextColor(TEXT_SECONDARY);
  if (user.organizationName) {
    doc.text(user.organizationName, margin + 5, yPos + 18);
  }
  
  doc.setFontSize(10);
  doc.text(user.email, margin + 5, yPos + 26);
  
  if (user.role) {
    doc.setFontSize(9);
    doc.setTextColor(SONSIEL_TEAL);
    const roleText = user.role.replace('_', ' ');
    doc.text(roleText, margin + contentWidth - 5 - doc.getTextWidth(roleText), yPos + 3);
  }
  
  yPos += 45;
  
  const addSection = (label: string, value: string | null | undefined) => {
    if (!value) return;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY);
    doc.text(label, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY);
    const valueLines = doc.splitTextToSize(value, contentWidth - 40);
    doc.text(valueLines, margin + 40, yPos);
    yPos += Math.max(8, valueLines.length * 5);
  };
  
  if (user.bio) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY);
    doc.text('Bio', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY);
    const bioLines = doc.splitTextToSize(user.bio, contentWidth);
    doc.text(bioLines, margin, yPos);
    yPos += bioLines.length * 5 + 5;
  }
  
  addSection('Phone:', user.phone);
  addSection('Experience:', user.yearsOfExperience ? `${user.yearsOfExperience} years` : null);
  addSection('Languages:', user.languagesSpoken?.join(', '));
  addSection('Timezone:', user.timezone);
  addSection('LinkedIn:', user.linkedInUrl);
  
  addFooter(doc, 1);
  doc.save(filename);
}

export async function exportElementToPDF(
  elementId: string, 
  filename: string,
  title?: string
) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }
  
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const doc = new jsPDF({
    orientation: imgHeight > imgWidth * 1.4 ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  if (title) {
    addHeader(doc, title);
    doc.addImage(imgData, 'PNG', 10, 65, imgWidth, imgHeight);
  } else {
    doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  }
  
  addFooter(doc, 1);
  doc.save(filename);
}

function getStatusColor(status?: string | null) {
  switch (status) {
    case 'COMPLETED':
      return { r: 22, g: 163, b: 74 };
    case 'IN_PROGRESS':
      return { r: 59, g: 130, b: 246 };
    case 'ON_HOLD':
      return { r: 234, g: 179, b: 8 };
    case 'CANCELLED':
      return { r: 239, g: 68, b: 68 };
    default:
      return { r: 100, g: 116, b: 139 };
  }
}

function formatStatus(status?: string | null): string {
  if (!status) return 'Not Started';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatCategory(category?: string | null): string {
  if (!category) return 'General';
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
