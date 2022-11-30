package com.mnm.copypastabackend.entities;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Entity
@Getter
@Setter
@Table(name = "quantity")
@ApiModel
public class Quantity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Basic
    @Column(name = "amount")
    private Float amount;

    @Basic(optional = false)
    @Column(name = "optional")
    private Boolean optional;

    @JoinColumn(name = "recipe_fk")
    @ManyToOne(fetch = FetchType.EAGER) // when this is lazy, all queries to recipe remain proxies
    @JsonIgnore
    private Recipe recipe;

    @JoinColumn(name = "ingredient_fk")
    @ManyToOne(fetch = FetchType.EAGER)
    private Ingredient ingredient;

    @JoinColumn(name = "unit_fk")
    @ManyToOne(fetch = FetchType.EAGER)
    private Unit unit;

    @Basic(optional = false)
    @Column(name = "ordering")
    @ApiModelProperty(notes = "Determines the order in which the quantity will be shown")
    private Integer ordering;
}
