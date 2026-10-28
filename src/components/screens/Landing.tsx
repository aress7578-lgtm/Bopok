'use client'

import { useRouter } from 'next/navigation'
import { CityScene } from '@/components/CityScene'
import { HeroMapBackground } from '@/components/landing/HeroMapBackground'
import { startDemo, startFresh } from '@/lib/plan-storage'

export function Landing() {
  const router = useRouter()
  const onStart = () => {
    startFresh()
    router.push('/plan/condition')
  }
  const onDemo = () => {
    startDemo()
    router.push('/plan/schedule')
  }
  return (
    <main>
      <nav className="nav">
        <a href="#" className="brand" aria-label="보폭 홈"><span>보</span>폭</a>
        <div className="nav-links"><a href="#about">서비스 소개</a><a href="#how">이용 방법</a><a href="#preview">미리보기</a></div>
        <button className="button small" onClick={onStart}>시작하기</button>
      </nav>

      <section className="hero">
        <HeroMapBackground />
        <div className="hero-copy">
          <div className="pin" aria-hidden="true"><span /></div>
          <h1>부모님 보폭에 맞춘<br />하루 여행</h1>
          <p className="lead">주차장에서 입구, 관람길 계단까지 계산해서<br className="desktop" /> 부모님이 편하게 걸을 수 있는 일정으로 고쳐드려요.</p>
          <div className="hero-actions">
            <button className="button hero-start" onClick={onStart}>지금 시작하기</button>
          </div>
        </div>
        <CityScene />
      </section>

      <section className="section" id="about">
        <div className="section-heading"><p className="eyebrow">놓치기 쉬운 이동까지</p><h2>지도 앱의 ‘도보 15분’엔<br />계단과 관람길이 빠져 있어요</h2><p>보폭은 목적지 사이뿐 아니라, 도착한 뒤 부모님이 실제로 걷는 길까지 살펴봐요.</p></div>
        <div className="compare">
          <div className="compare-side muted"><span className="label">일반 지도 앱</span><strong>도보 15분</strong><p>빠진 정보</p><ul><li>주차장 → 입구 동선</li><li>관람길 계단</li><li>쉴 곳 위치</li></ul></div>
          <div className="compare-side"><span className="label blue-label">보폭</span><strong className="blue-text">실제 약 38분</strong><p>걷는 모든 구간</p><div className="segments"><i /><i /><i /></div><div className="legend"><span>이동 12분</span><span>입구까지 9분</span><span>관람 17분</span></div></div>
        </div>
      </section>

      <section className="section steps-section" id="how">
        <div className="section-heading"><p className="eyebrow">이용 방법</p><h2>세 번만 고르면 돼요</h2></div>
        <div className="steps">
          {[
            ['01', '부모님 조건 고르기', '“동네 마트까지 쉬지 않고 걸어가세요?”처럼 생활 예시로 골라요.'],
            ['02', '일정 넣기', '“10시 한빛탑, 점심은 성심당”처럼 편하게 적으면 정리해요.'],
            ['03', '판정·수정안 받기', '넘는 구간을 보여주고, 우회로나 휴식으로 고쳐드려요.'],
          ].map(([n, title, text]) => <article className="step" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p><div className="mini-line"><i /><i /><i /></div></article>)}
        </div>
      </section>

      <section className="preview-band" id="preview">
        <div className="preview-copy"><p className="eyebrow">미리보기</p><h2>어디서 힘드신지<br />미리 알려드려요</h2><p>구간을 누르면 그 길만 잘라서 보여주고,<br />조건을 넘는 이유도 쉽게 설명해요.</p><div className="pills"><span>구간만 잘라보기</span><span>우회로 한 번에 적용</span></div></div>
        <div className="browser">
          <div className="browser-top"><i /><i /><i /></div>
          <div className="browser-body"><div className="mock-map"><span>한빛탑 입구</span><div className="route" /></div><div className="mock-panel"><small>구간별 판정</small><b>입구 → 전망 구역</b><p>110m · 약 6~8분</p><span className="warn-badge">! 조정 필요</span><button>우회로로 바꾸기</button></div></div>
        </div>
      </section>

      <section className="section principles">
        <div className="section-heading"><p className="eyebrow">보폭의 원칙</p><h2>나이로 짐작하지 않아요</h2></div>
        <div className="principle-grid">{[
          ['01', '고른 조건만 써요', '나이가 아니라 가족이 고른 걷기 조건으로만 판단해요.'],
          ['02', '출처를 함께 보여줘요', '모든 거리와 계단 수에 출처와 확인 날짜를 붙여요.'],
          ['03', '광고는 따로 둬요', '광고는 판정과 수정안에 영향을 주지 않아요.'],
        ].map(([n,t,d]) => <div key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div>
      </section>

      <section className="cta"><div><p>이번 주말 나들이</p><h2>부모님과 편하게<br />걸을 수 있는지 확인해 보세요.</h2><small>회원가입 없이 3분이면 돼요.</small></div><div className="cta-actions"><button className="button light" onClick={onStart}>지금 바로 시작하기</button><button className="demo-link" onClick={onDemo}>예시로 체험하기 →</button></div></section>
      <footer><a href="#" className="brand"><span>보</span>폭</a><p>© 2026 merge</p><p>데이터: 한국관광공사 무장애 여행 정보</p></footer>
    </main>
  )
}
