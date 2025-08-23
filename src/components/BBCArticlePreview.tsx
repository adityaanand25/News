import React from 'react';
import { ExternalLink, Clock, User, Tag, Image as ImageIcon } from 'lucide-react';

interface BBCArticleData {
  headline: string;
  content: string;
  author?: string;
  publishDate: string;
  category?: string;
  imageUrl?: string;
  tags: string[];
  url: string;
}

interface BBCArticlePreviewProps {
  article: BBCArticleData;
  isVisible: boolean;
}

export const BBCArticlePreview: React.FC<BBCArticlePreviewProps> = ({ article, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
      <div className="flex items-start gap-3">
        {/* BBC Logo/Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BBC</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-red-800">BBC News</span>
            {article.category && (
              <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-medium rounded-full">
                {article.category}
              </span>
            )}
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Enhanced Scraping
            </span>
          </div>

          {/* Article Info */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {article.headline}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {article.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.publishDate}
            </span>
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              BBC Article
            </span>
          </div>

          {/* Image indicator */}
          {article.imageUrl && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <ImageIcon className="w-3 h-3" />
              <span>Image available</span>
            </div>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {article.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{article.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content Preview */}
          <p className="text-sm text-gray-700 line-clamp-2">
            {article.content.substring(0, 150)}...
          </p>

          {/* Enhanced Features Notice */}
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="flex items-center gap-1 text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Enhanced BBC Scraping Active</span>
            </div>
            <p className="text-blue-600 mt-1">
              Specialized extraction for headlines, content, metadata, and tags
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
