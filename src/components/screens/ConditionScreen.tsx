'use client'

import { usePlan } from '@/components/PlanProvider'
import { questions } from '@/lib/plan-data'

export function ConditionScreen() {
  const { state, update, go } = usePlan()
  const { answers, question } = state
  const done = question === 5
  const choose = (index: number) => {
    const next = [...answers]
    next[question] = index
    update({ answers: next })
  }
  return <div className="planner-content">
    {!done ? <>
      <p className="helper-line">부모님과 함께 골라 주세요</p><p className="question-count">질문 {question + 1} / 5</p>
      <div className="progress-track"><i style={{ width: `${(question + 1) * 20}%` }} /></div>
      <h1>{questions[question].title}</h1>
      <p className="question-help">평소 모습을 떠올리며 가장 가까운 답을 골라주세요.</p>
      <div className="choices">
        {questions[question].options.map((item, i) => <button key={item} className={answers[question] === i ? 'choice selected' : 'choice'} onClick={() => choose(i)}><span><b>{item}</b><small>{questions[question].notes[i]}</small></span><i>{answers[question] === i ? '✓' : ''}</i></button>)}
      </div>
      {question < 3 && <small className="example-note">예시 값</small>}
      <div className="planner-actions"><button className="back" disabled={question === 0} onClick={() => update({ question: question - 1 })}>이전</button><button className="button" disabled={answers[question] === undefined} onClick={() => update({ question: question + 1 })}>{question === 4 ? '선택 완료' : '다음'}</button></div>
    </> : <>
      <p className="question-count">조건 입력 완료</p><h1>이렇게 고르셨어요</h1><p className="question-help">여행 일정에 맞춰 걷기 좋은 길을 찾아볼게요.</p>
      <div className="summary">{questions.map((q, i) => <button key={q.title} onClick={() => update({ question: i })}><small>{q.title}</small><b>{q.options[answers[i]]}{answers[i] === q.options.length - 1 && <em>기본값</em>}</b><span>수정</span></button>)}</div>
      <div className="planner-actions"><button className="back" onClick={() => update({ answers: [], question: 0 })}>다시 고르기</button><button className="button" onClick={() => go('/plan/schedule')}>다음: 일정 입력</button></div>
    </>}
  </div>
}
