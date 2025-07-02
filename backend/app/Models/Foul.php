<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Foul extends Model
{
    protected $table = 'fouls';
    protected $fillable = ['fk_id_players','yellow_card', 'red_card', 'fouls_amount'];

    public function player(): BelongsTo {
        return $this->belongsTo(Player::class);
    }
}
