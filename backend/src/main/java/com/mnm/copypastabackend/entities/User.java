package com.mnm.copypastabackend.entities;


import java.util.List;

import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "users")
@ApiModel
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Basic(optional = false)
    @ApiModelProperty(notes = "Username of the user")
    @Column(name = "name")
    private String name;

    @Basic(optional = false)
    @Column(name = "password")
    @ApiModelProperty(notes = "Password hash of registered user", example = "I'm not telling!")
    @JsonProperty(required = true, access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "pic_fk", referencedColumnName = "id")
    @ApiModelProperty(name = "pic", notes = "Optional picture for the user")
    private Pic pic;

    @Basic
    @Column(name = "pic_offset_x")
    @ApiModelProperty(notes = "Percentage by which image is offset on X")
    private Integer picOffsetX;

    @Basic
    @Column(name = "pic_offset_y")
    @ApiModelProperty(notes = "Percentage by which image is offset on Y")
    private Integer picOffsetY;

    @OneToMany(mappedBy = "uploadedBy", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Pic> pics;
}
