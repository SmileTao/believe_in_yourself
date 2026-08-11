import { useMemo } from 'react';
import { APP_SLOGAN, GENTLE_WORDS } from '@shared/constants';
import { formatPrettyChinese } from '@shared/utils/date';
import Logo from '../../../components/Logo';
import './SloganHeader.less';

/** 首屏 Slogan + 日期 + 温柔文案 */
export default function SloganHeader() {
  const today = useMemo(() => formatPrettyChinese(), []);
  const word = useMemo(() => {
    const idx = new Date().getDate() % GENTLE_WORDS.length;
    return GENTLE_WORDS[idx];
  }, []);

  return (
    <section className="slogan-header card">
      <div className="date-row">
        <Logo size={28} withBg={false} />
        <span className="date-text">{today}</span>
      </div>
      <h1 className="slogan-text">{APP_SLOGAN}</h1>
      <p className="gentle-word">{word}</p>
    </section>
  );
}
