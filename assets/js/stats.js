'use strict'

var defaultSkill = function () { return [25.0, 25.0 / 3.0] }

var playerStats = function (games) {
  return games
    .sort(function (a, b) { return a.datetime - b.datetime })
    .reduce(function (a, doc) {
      var p1 = a[doc.player1] || (a[doc.player1] = {win: 0, lose: 0, total: 0, skill: defaultSkill()})
      var p2 = a[doc.player2] || (a[doc.player2] = {win: 0, lose: 0, total: 0, skill: defaultSkill()})
      p1[doc.player1 === doc.winner ? 'win' : 'lose']++
      p2[doc.player2 === doc.winner ? 'win' : 'lose']++
      p1.total++
      p2.total++

      p1.rank = doc.player1 === doc.winner ? 1 : 2
      p2.rank = doc.player2 === doc.winner ? 1 : 2

      trueskill.AdjustPlayers([p1, p2])

      return a
    }, {})
}

var skillLevel = function (s) {
  return s[0] - 3 * s[1]
}

var db = PouchDB('https://a36fd2d5-43db-44c5-b3b7-88104a291bb7-bluemix.cloudant.com/king-of-pong', {
  auth: {
    username: 'okenceasteromeasperrityt',
    password: 'f1eb1fc878647fa27ce2a8be8728902bd75b4409'
  }
})

db.allDocs({
    startkey: 'game/',
    endkey: 'game/\uffff',
    include_docs: true
  })
  .then(function (userDocs) {
    return userDocs.rows.map(function (row) {
      var doc = row.doc
      return {
        player1: doc.player1,
        player2: doc.player2,
        winner: doc.winner,
        datetime: doc.datetime
      }
    })
  })
  .then(function (games) {
    var stats = playerStats(games)
    var playerIds = Object.keys(stats)

    playerIds
      .sort(function (a, b) {
        var s1 = skillLevel(stats[a].skill)
        var s2 = skillLevel(stats[b].skill)

        return s2 - s1
      })
      .forEach(function (id, i) {
        stats[id].order = i
      })

    document.querySelectorAll('.pong-stat').forEach(function (statEl, i) {
      var id = statEl.getAttribute('data-id')
      var playerStats = stats[id]
      if (playerStats) {
        statEl.innerHTML = (playerStats.skill[0] - playerStats.skill[1] * 3).toFixed(1) +
          (playerStats.order === 0 ? '&nbsp;<i class="material-icons" title="King of Pong">grade</i>' : '')
      }
    })
  })

fetch('https://gist.githubusercontent.com/perliedman/55b124308d68458ad29a3824e18f9aa4/raw/rankme-stats.txt', {mode: 'cors'})
  .then(function (res) { return res.text() })
  .then(function (data) {
    var lines = data.split('\n')
    var stats = lines.reduce(function (a, line) {
      var cols = line.split('\t')
      a[cols[0]] = {
        kdr: Number(cols[1]),
        score: Number(cols[2])
      }
      return a
    }, {})

    Object.keys(stats)
      .sort(function (a, b) {
        return stats[b].kdr - stats[a].kdr
      })
      .forEach(function (id, i) {
        stats[id].order = i
      })

    document.querySelectorAll('.cs-stat').forEach(function (statEl, i) {
      var id = statEl.getAttribute('data-id')
      var playerStats = stats[id]
      if (playerStats) {
        statEl.innerHTML = playerStats.kdr.toFixed(2) +
          (playerStats.order === 0 ? '&nbsp;<i class="material-icons" title="CS Champion">grade</i>' : '')
      }
    })
  })
