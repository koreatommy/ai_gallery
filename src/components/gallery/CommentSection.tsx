'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { commentService } from '@/lib/database';
import type { Comment } from '@/types';
import { toast } from 'sonner';

interface CommentSectionProps {
  imageId: string;
  initialComments?: Comment[];
  userId?: string;
}

export default function CommentSection({
  imageId,
  initialComments = [],
  userId = '00000000-0000-0000-0000-000000000000'
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [imageId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await commentService.getByImageId(imageId);
      setComments(data);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
      toast.error('댓글을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    const content = newComment.trim();
    if (!content) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }

    if (content.length > 500) {
      toast.error('댓글은 500자 이내로 작성해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const comment = await commentService.create(imageId, content, userId);
      setComments(prev => [...prev, comment]);
      setNewComment('');
      toast.success('댓글이 작성되었습니다');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      toast.error('댓글 작성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await commentService.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('댓글이 삭제되었습니다');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      toast.error('댓글 삭제에 실패했습니다');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <MessageCircle className="h-5 w-5" />
          <span>댓글 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-200">
      {/* 댓글 헤더 */}
      <div className="flex items-center gap-3 p-6 pb-0">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full">
          <MessageCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">댓글</h3>
          <p className="text-sm text-gray-500">
            {comments.length > 0 ? `${comments.length}개의 댓글` : '첫 댓글을 남겨보세요'}
          </p>
        </div>
      </div>

      {/* 댓글 작성 */}
      <div className="px-6 pb-6 border-b border-gray-100">
        <div className="flex gap-3">
          {/* 작성자 아바타 */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="h-5 w-5 text-white" />
          </div>
          
          {/* 댓글 입력 영역 */}
          <div className="flex-1 space-y-3">
            <div className="relative">
              <Textarea
                placeholder="댓글을 입력하세요... (Ctrl+Enter로 빠른 작성)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={3}
                maxLength={500}
                className="resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-lg pr-16"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {newComment.length}/500
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs">Ctrl</kbd>
                +
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs">Enter</kbd>
                로 빠른 작성
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    작성 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    댓글 작성
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="px-6 pb-6">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">아직 댓글이 없어요</h4>
            <p className="text-sm text-gray-500 mb-4">
              첫 번째 댓글을 작성해서 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <div 
                key={comment.id} 
                className="group relative animate-in fade-in duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-3">
                  {/* 사용자 아바타 */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>

                  {/* 댓글 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm text-gray-900">
                          익명 사용자
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                        {comment.content}
                      </p>

                      {/* 삭제 버튼 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}