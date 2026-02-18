'use client';

import { QRCodeSVG } from 'qrcode.react';

export type MemberCategory = 'SOCIO' | 'VIP' | 'GENERAL';

interface DigitalMemberCardProps {
    member: {
        id: string;
        name: string;
        category: MemberCategory;
        membershipDueDate?: Date;
        // Federation data (future feature)
        nationalRanking?: number;
        recentTournaments?: Array<{
            name: string;
            position: number;
            date: Date;
        }>;
    };
}

/**
 * 🏛️ Digital Member Card - Heritage Elite Style
 * For CLUB_SOCIOS model only
 */
export default function DigitalMemberCard({ member }: DigitalMemberCardProps) {
    return (
        <div className="digital-card heritage-elite">
            <div className="card-header">
                <div className="member-avatar">
                    <div className="avatar-letter">{member.name.charAt(0)}</div>
                    <div className={`ring ring-${member.category.toLowerCase()}`} />
                </div>
                <div className="member-info">
                    <h2>{member.name}</h2>
                    <span className={`category-badge category-${member.category.toLowerCase()}`}>
                        {member.category}
                    </span>
                </div>
            </div>

            <div className="card-body">
                <div className="qr-section">
                    <QRCodeSVG
                        value={member.id}
                        size={140}
                        level="H"
                        fgColor="var(--color-text-primary)"
                        bgColor="transparent"
                    />
                </div>

                {member.nationalRanking && (
                    <div className="ranking-section">
                        <span className="label">Ranking Nacional SRE</span>
                        <span className="value">#{member.nationalRanking}</span>
                    </div>
                )}

                {member.membershipDueDate && (
                    <div className="membership-status">
                        <span className="label">Vigencia hasta</span>
                        <span className="date">
                            {new Date(member.membershipDueDate).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                )}

                {member.recentTournaments && member.recentTournaments.length > 0 && (
                    <div className="recent-tournaments">
                        <h3>Últimos Torneos</h3>
                        <ul>
                            {member.recentTournaments.slice(0, 3).map((tournament, index) => (
                                <li key={index}>
                                    <span className="tournament-name">{tournament.name}</span>
                                    <span className="position">{tournament.position}º lugar</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <style jsx>{`
                .digital-card.heritage-elite {
                    background: linear-gradient(145deg, 
                        var(--color-primary), 
                        rgba(212, 175, 55, 0.1)
                    );
                    border: 2px solid var(--color-secondary);
                    border-radius: var(--border-radius);
                    padding: 24px;
                    color: var(--color-text-primary);
                    box-shadow: 0 8px 32px rgba(212, 175, 55, 0.15);
                }
                
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
                }
                
                .member-avatar {
                    position: relative;
                    width: 64px;
                    height: 64px;
                }
                
                .avatar-letter {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: var(--color-secondary);
                    color: var(--color-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    font-weight: var(--font-heading-weight);
                    font-family: var(--font-heading);
                }
                
                .ring {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: conic-gradient(
                        from 0deg,
                        var(--ring-color),
                        transparent 180deg,
                        var(--ring-color) 360deg
                    );
                    animation: rotate 3s linear infinite;
                    z-index: -1;
                }
                
                .ring-socio {
                    --ring-color: var(--color-secondary);
                }
                
                .ring-vip {
                    --ring-color: #FFD700;
                }
                
                .ring-general {
                    --ring-color: #C0C0C0;
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .member-info h2 {
                    margin: 0;
                    font-family: var(--font-heading);
                    font-size: 20px;
                    font-weight: var(--font-heading-weight);
                    color: var(--color-text-primary);
                }
                
                .category-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .category-socio {
                    background: rgba(212, 175, 55, 0.2);
                    color: var(--color-secondary);
                }
                
                .category-vip {
                    background: rgba(255, 215, 0, 0.2);
                    color: #FFD700;
                }
                
                .category-general {
                    background: rgba(192, 192, 192, 0.2);
                    color: #C0C0C0;
                }
                
                .card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .qr-section {
                    display: flex;
                    justify-content: center;
                    padding: 16px;
                    background: rgba(255, 248, 231, 0.95);
                    border-radius: 8px;
                }
                
                .ranking-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(212, 175, 55, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid var(--color-secondary);
                }
                
                .ranking-section .label {
                    color: var(--color-text-secondary);
                    font-size: 14px;
                }
                
                .ranking-section .value {
                    font-family: var(--font-heading);
                    font-size: 24px;
                    font-weight: var(--font-heading-weight);
                    color: var(--color-secondary);
                }
                
                .membership-status {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px 16px;
                    background: rgba(212, 175, 55, 0.05);
                    border-radius: 8px;
                }
                
                .membership-status .label {
                    color: var(--color-text-secondary);
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .membership-status .date {
                    color: var(--color-text-primary);
                    font-size: 16px;
                    font-weight: 500;
                }
                
                .recent-tournaments h3 {
                    margin: 0 0 12px 0;
                    font-family: var(--font-heading);
                    font-size: 14px;
                    font-weight: var(--font-heading-weight);
                    color: var(--color-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .recent-tournaments ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .recent-tournaments li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: rgba(212, 175, 55, 0.05);
                    border-radius: 4px;
                    font-size: 13px;
                }
                
                .tournament-name {
                    color: var(--color-text-primary);
                }
                
                .position {
                    color: var(--color-secondary);
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
