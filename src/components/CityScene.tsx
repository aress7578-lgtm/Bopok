export function CityScene() {
  return (
    <svg className="city-scene" viewBox="0 0 1440 380" role="img" aria-label="대전의 여행지를 표현한 도시 일러스트">
      <path className="hill" d="M0 250L120 205l110 45 125-60 120 60 155-80 140 80 155-45 120 45 160-90 135 90v130H0z" />
      <g className="far-buildings">
        <path d="M54 250h92v104H54zM73 224h54l19 26H54z" />
        <path d="M172 274h78v80h-78zM184 290h16v19h-16zM214 290h16v19h-16z" />
        <path d="M1130 252h82v102h-82zM1147 270h13v13h-13zM1178 270h13v13h-13z" />
        <path d="M1280 265h104v89h-104zM1297 282h16v18h-16zM1324 282h16v18h-16z" />
      </g>
      <g className="landmarks">
        <path className="warm" d="M310 354h70l10-202h-90z" />
        <path className="warm-cap" d="M302 152h96v14h-96z" />
        <path className="blue" d="M962 354h70l-10-238h-50z" />
        <path className="blue-cap" d="M969 116h56l-28-25z" />
        <path d="M700 354v-86h75v86zM718 286h14v17h-14zM743 286h14v17h-14z" className="mid" />
      </g>
      <g className="trees">
        <circle cx="410" cy="330" r="24" /><circle cx="440" cy="326" r="29" /><rect x="434" y="326" width="7" height="28" />
        <circle cx="1066" cy="313" r="26" /><circle cx="1099" cy="327" r="31" /><rect x="1094" y="326" width="8" height="28" />
        <circle cx="822" cy="335" r="22" /><circle cx="846" cy="330" r="26" />
      </g>
      <g className="cars"><path d="M542 334h62l13 11v9h-88v-12z" /><circle cx="548" cy="355" r="7" /><circle cx="598" cy="355" r="7" /></g>
      <path className="road" d="M0 354h1440v26H0z" />
    </svg>
  )
}
