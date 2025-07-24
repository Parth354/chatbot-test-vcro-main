import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadFormField } from '@/types/agent';

interface LeadCollectionFormProps {
  fields: LeadFormField[];
  submitText: string;
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
}

export default function LeadCollectionForm({ fields, submitText, onSubmit, onCancel }: LeadCollectionFormProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateLinkedInUrl = (url: string) => {
    const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedInPattern.test(url);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id].toString().trim() === '')) {
        newErrors[field.id] = `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
      
      if (field.system_field === 'linkedin_profile' && formData[field.id] && !validateLinkedInUrl(formData[field.id])) {
        newErrors[field.id] = 'Please enter a valid LinkedIn profile URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border max-w-md w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {sortedFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === 'text' && (
              <Input
                id={field.id}
                type="text"
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={errors[field.id] ? 'border-red-500' : ''}
              />
            )}
            
            {field.type === 'email' && (
              <Input
                id={field.id}
                type="email"
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={errors[field.id] ? 'border-red-500' : ''}
              />
            )}
            
            {field.type === 'phone' && (
              <Input
                id={field.id}
                type="tel"
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={errors[field.id] ? 'border-red-500' : ''}
              />
            )}
            
            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={errors[field.id] ? 'border-red-500' : ''}
                rows={3}
              />
            )}
            
            {field.type === 'select' && (
              <Select
                value={formData[field.id] || ''}
                onValueChange={(value) => handleInputChange(field.id, value)}
              >
                <SelectTrigger id={field.id} className={errors[field.id] ? 'border-red-500' : ''}>
                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={formData[field.id] || false}
                  onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                />
                <label htmlFor={field.id} className="text-sm text-gray-700">
                  {field.placeholder || field.label}
                </label>
              </div>
            )}
            
            {errors[field.id] && (
              <p className="text-red-500 text-xs">{errors[field.id]}</p>
            )}
          </div>
        ))}
        
        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1">
            {submitText}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}