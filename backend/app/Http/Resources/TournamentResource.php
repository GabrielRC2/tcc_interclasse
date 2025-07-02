<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        

        return [
            'id' => $this->id,
            'tournaments_name'=>$this->tournaments_name,
            'start_date'=>$this->start_date->format('Y-m-d'),
            'end_date'=>$this->end_date->format('Y-m-d'),
        ];
    }
}
