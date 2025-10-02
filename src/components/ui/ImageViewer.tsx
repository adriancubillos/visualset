'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageViewerProps {
    imageUrl: string | null | undefined;
    alt: string;
    size?: 'small' | 'medium' | 'large' | 'extraLarge';
    className?: string;
    showModal?: boolean;
}

export default function ImageViewer({
    imageUrl,
    alt,
    size = 'small',
    className = '',
    showModal = true,
}: ImageViewerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!imageUrl) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 rounded-lg ${size === 'small' ? 'w-16 h-16' : size === 'medium' ? 'w-32 h-32' : 'w-64 h-64'
                    } ${className}`}>
                <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        );
    }

    const sizeClasses = {
        small: 'max-w-[64px] max-h-[64px]',
        medium: 'max-w-[128px] max-h-[128px]',
        large: 'max-w-[256px] max-h-[256px]',
        extraLarge: 'max-w-[512px] max-h-[512px]',
    };

    return (
        <>
            {/* Thumbnail */}
            <div
                className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-gray-200 ${showModal ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                    } ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (showModal) setIsModalOpen(true);
                }}
                title={showModal ? 'Click to view larger' : alt}>
                <Image
                    src={imageUrl}
                    alt={alt}
                    width={size === 'small' ? 64 : size === 'medium' ? 128 : size === 'large' ? 256 : 512}
                    height={size === 'small' ? 64 : size === 'medium' ? 128 : size === 'large' ? 256 : 512}
                    sizes={size === 'small' ? '64px' : size === 'medium' ? '128px' : size === 'large' ? '256px' : '512px'}
                    className="object-contain w-full h-auto"
                />
            </div>

            {/* Modal */}
            {showModal && isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                    onClick={() => setIsModalOpen(false)}>
                    <div
                        className="relative max-w-4xl max-h-[90vh] w-full h-full"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                            title="Close (ESC)">
                            <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Image */}
                        <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt={alt}
                                fill
                                className="object-contain"
                                sizes="(max-width: 1024px) 100vw, 1024px"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
