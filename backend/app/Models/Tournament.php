<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    protected $table = 'tournaments';
    protected $fillable = ['tournaments_name', 'start_date', 'end_date'];

    // Adicione isto para que o Eloquent trate as colunas como objetos Carbon
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];
}
