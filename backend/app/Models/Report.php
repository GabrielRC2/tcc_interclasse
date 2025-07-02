<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Report extends Model
{
    protected $table = 'reports';
    protected $fillable = ['fk_id_matches', 'team1_points', 'team2_points'];

    public function matches():HasOne {
        return $this->hasOne(Matches::class);
    }

    public function teams(): BelongsToMany{
        return $this->belongsToMany(Team::class, 'report_team', 'fk_id_reports', 'fk_id_teams');
    }
}
